from fastapi import FastAPI, Request, WebSocket, UploadFile
from tempfile import NamedTemporaryFile
from fastapi.responses import HTMLResponse
from typing import Dict, Callable
from deepgram import Deepgram
from dotenv import load_dotenv
import asyncio
import os
from io import BytesIO
import json
from fastapi.middleware.cors import CORSMiddleware
import openai
import time
import sys
import re
import tempfile
import shutil
import subprocess
from fastapi.responses import StreamingResponse
from pdfminer.high_level import extract_text

load_dotenv(dotenv_path = os.path.join(os.getcwd(), '.env'))

app = FastAPI()

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dg_client = Deepgram(os.environ.get('dg_key'))

openai.api_key = os.environ.get('open_ai_key')

def get_gpt_chat_response(messages, model="gpt-3.5-turbo", temperature=0.3, stream=True):
    max_retries = 5
    backoff_factor = 2
    initial_delay = 0.1  # in seconds

    for retry in range(max_retries):
        try:
            # Call the GPT-3 API
            response = openai.ChatCompletion.create(
                model=model,
                messages=messages,
                n=1,
                stream=stream,
                temperature=temperature,
            )
            return response

        except openai.error.RateLimitError as e:
            if retry == max_retries - 1:
                raise e
            else:
                sleep_time = initial_delay * (backoff_factor**retry)
                time.sleep(sleep_time)
    
def get_outline(input_text, is_pdf):
    if is_pdf:    
        prompt = f"The following is a section of a PDF:\n\n{input_text}\n\n . Please provide an outline of the content."
    else:
        prompt = f"The following is a transcription of a video which might have timestamps in seconds:\n\n{input_text}\n\n . If there are timestamps please make sure to keep the timestamps in seconds from the original input text. Then, please provide an outline of the content while mentioning the important timestamps, if they exist, in this example format: 'At timestamp <time_stamp>,'."
    message = [{"role": "system", "content": prompt}]
    response = get_gpt_chat_response(message)
    return response

def get_title(input_text, is_pdf):
    if is_pdf:    
        prompt = f"The following is a section of a PDF:\n\n{input_text}\n\n . Please provide a title for the content."
    else:
        prompt = f"The following is a transcription of a video:\n\n{input_text}\n\n . Please provide a title for the content."
    message = [{"role": "system", "content": prompt}]
    response = get_gpt_chat_response(message)
    return response

def get_summary(input_text, is_pdf):
    if is_pdf:    
        prompt = f"The following is a section of a PDF:\n\n{input_text}\n\n . Please provide a summary for the content."
    else:
        prompt = f"The following is a transcription of a video:\n\n{input_text}\n\n . Please provide a summary for the content."
    message = [{"role": "system", "content": prompt}]
    response = get_gpt_chat_response(message)
    return response

def get_bullet_points(input_text, is_pdf):
    if is_pdf:    
        prompt = f"The following is a section of a PDF:\n\n{input_text}\n\n . Can you keep all the sentences that contain specific details and output them in bullet points?"
    else:
        prompt = f"The following is a transcription of a video:\n\n{input_text}\n\n . Can you keep all the sentences that contain specific details and output them in bullet points?"
    message = [{"role": "system", "content": prompt}]
    response = get_gpt_chat_response(message)
    return response

def get_chat_response(input_text, input_type, is_pdf):
    if input_type == 'Title':
        return get_title(input_text, is_pdf)
    if input_type == 'Summary':
        return get_summary(input_text, is_pdf) 
    if input_type == 'BulletPoints':
        return get_bullet_points(input_text, is_pdf) 
    if input_type == 'Outline':
        return get_outline(input_text, is_pdf) 

def generate_bullet_points_html(text):
    bullet_points = []
    lines = text.split('\n')

    for line in lines:
        line = line.strip()
        if line.startswith('-'):
            sentence = line[1:].strip()
            bullet_point = f'<li>{sentence}</li>'
            bullet_points.append(bullet_point)

    bullet_points_html = '<ul>\n' + '\n'.join(bullet_points) + '\n</ul>'
    return bullet_points_html

def generate_outline_with_timestamp_html(text):
    pattern = r'At timestamp ([\d:]+),'
    matches = re.findall(pattern, text)
    if len(matches) == 0:
        return text
        
    bullet_points = []
    for timestamp in matches:
        description = re.search(f'{timestamp}(.+?)(?=(At timestamp|\Z))', text, re.DOTALL)
        if description:
            bullet_point = f'<li>At {timestamp}{description.group(1).strip()}</li>'
            bullet_points.append(bullet_point)

    bullet_points_html = '<ul>\n' + '\n'.join(bullet_points) + '\n</ul>'
    return bullet_points_html

def format_chat_response(input_text, input_type, is_pdf):
    if input_type == 'Title':
        return f"<br/><h2>{input_text}</h2><br/>"
    if input_type == 'Summary':
        return f"<br/><p>{input_text}</p><br/>"
    if input_type == 'BulletPoints':
        return generate_bullet_points_html(input_text) 
    if input_type == 'Outline':
        if is_pdf:
            return input_text
        else:
            print("lam")
            print(input_text)
            print(generate_outline_with_timestamp_html(input_text))
            return generate_outline_with_timestamp_html(input_text)

def format_time(timestamp):
    minutes = timestamp // 60
    seconds = timestamp % 60
    return "{:02d}:{:02d}".format(minutes, seconds)

def get_formatted_transcript(paragraphs, get_timestamp=False, get_speaker=False):
    transcript = ''
    for paragraph in paragraphs:
        time_string = format_time(paragraph['start'])
        text = ""
        if get_speaker:
            text += f"<Speaker {paragraph['speaker']}> "
        if get_timestamp:
            text += f"{time_string} "
        text += f"{paragraph['text']} \n"
        transcript += text
    return transcript    
    
def get_transcribed_text(responses):
    results = {
        'paragraphs': [],
        'transcript': '',
        'transcript_with_ts': '',
        'transcript_with_ts_and_speaker': ''
    }

    response_start_timestamp = 0
    for response in responses:
        paragraphs = response['results']['channels'][0]['alternatives'][0]['paragraphs']['paragraphs']
        for paragraph in paragraphs:
            paragraph_data = {
                'speaker': paragraph['speaker'],
                'start': response_start_timestamp + int(paragraph['start']),
                'end': response_start_timestamp + int(paragraph['end']),
                'text': ' '.join(sentence['text'] for sentence in paragraph['sentences'])
            }
            results['paragraphs'].append(paragraph_data)
            
        response_start_timestamp += int(response['metadata']['duration'])
    
    processed_paragraphs = results['paragraphs']
    results['transcript'] = get_formatted_transcript(processed_paragraphs)
    results['transcript_with_ts'] = get_formatted_transcript(processed_paragraphs, get_timestamp=True)
    results['transcript_with_ts_and_speaker'] = get_formatted_transcript(processed_paragraphs, get_timestamp=True, get_speaker=True)
    
    return results

def get_transcribed_text_from_responses(responses):    
    # Sort the list by index using sorted()
    sorted_responses = sorted(responses, key=lambda obj: obj['index'])
    deep_gram_responses = []
    for response in sorted_responses:
        deep_gram_responses.append(response['response'])       
    return get_transcribed_text(deep_gram_responses)
        
async def get_deepgram_transcript(index, source, callback):
    print("at start get response")
    response = await dg_client.transcription.prerecorded(
                      source,
                      {
                        'model': 'whisper-large',
                        'punctuate': True,
                        'detect_language' : True,
                        'diarize': True,
                        'paragraphs': True,
                        'summarize': True,
                      }
                    )
    print("at end await")
    callback({'index': index, 'response': response})

async def transcribe_audio_file(file: UploadFile): 
    with NamedTemporaryFile(delete=True) as temp_file:
        file_content = await file.read()
        file_buffer = BytesIO(file_content)
        source = {'buffer': file_buffer, 'mimetype': file.content_type}
        
        left_over_bytes = file_buffer.getbuffer().nbytes
        print(f"left_over_bytes size: {left_over_bytes} bytes")

        CHUNK_SIZE  = 4000000
        chunks = []
        while True:
            to_read = CHUNK_SIZE
            if CHUNK_SIZE * 2 > left_over_bytes:
                to_read = left_over_bytes
            chunk = file_buffer.read(to_read)
            left_over_bytes -= to_read
            chunks.append(chunk)
            if left_over_bytes == 0:
                break
                
        # Process each chunk asynchronously
        data = []
        index = 0
        for chunk in chunks:
            index += 1
            chunk_buffer = BytesIO(chunk)
            chunk_source = {'buffer': chunk_buffer, 'mimetype': file.content_type}
            task = asyncio.ensure_future(get_deepgram_transcript(index, chunk_source, data.append))
            
        while True:
            await asyncio.sleep(1.0)
            print("hello")
            print(len(data))
            print(len(chunks))
            yield ""
            if len(data) == len(chunks):
                toreturn = get_transcribed_text_from_responses(data)['transcript_with_ts']
                print(toreturn)
                yield toreturn
                break
    
@app.post(path="/back_end_upload_file")
async def get_upload_file_transcript(file: UploadFile):
    if file.content_type == "application/pdf":
        # Create a temporary file to save the uploaded PDF
        text = ""
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=True) as temp_file:
        
            temp_file.write(file.file.read())
            temp_file.flush()
            text = extract_text(temp_file.name)
        print(text)
        return StreamingResponse(text)
    
    return StreamingResponse(transcribe_audio_file(file))

@app.websocket("/back_end_stream_chat")
async def stream(websocket: WebSocket):
    await websocket.accept()
    
    # Receive message from the WebSocket
    data = await websocket.receive_text()
    print(f"Received: {data}")
    data = json.loads(data)

    answer = ""
    response = get_chat_response(data['input_text'], data['input_type'], data['is_pdf'])

    for chunk in response:
        chunk_message = chunk["choices"][0]["delta"]  # extract the message
        if "content" in chunk_message:
            answer += chunk_message["content"]
        print(answer)
        formatted_answer = format_chat_response(answer, data['input_type'], data['is_pdf'])
        await websocket.send_text(f"{formatted_answer}")

    await websocket.close()
  
@app.get("/back_end")
async def root():
    return {"message": "Hello World"}

