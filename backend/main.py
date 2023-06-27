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
import requests
import math
from pydub import AudioSegment
from pydub.utils import make_chunks
import json
import asyncio
import websocket
import base64

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

def get_lines_from_response(response, initial_offset):
    lines = []
    transcription = ''
    for line in response['prediction']:
        transcription = line['transcription']
        start = int(line['time_begin'] + initial_offset)
        end = int(line['time_end'] + initial_offset)
        lines.append(
            {
                'start': int(line['time_begin'] + initial_offset),
                'end': int(line['time_end'] + initial_offset),
                'text': line['transcription'],
            }
        )

    every_five_lines = []
    text = ''
    for i in range(0, len(lines)):
        line = lines[i]
        if i % 10 == 0:
            every_five_lines.append({
                'start': int(line['start'] + initial_offset),
                'end': int(line['end'] + initial_offset),
                'text': line['text'],
            })
        else:
            every_five_lines[-1]['end'] = line['end']
            every_five_lines[-1]['text'] += line['text']
    return every_five_lines
    
def add_paragraph_tags(text):
    print(text)
    paragraphs = text.split('\n')
    formatted_text = ''.join(f'<p key="{index}">{paragraph}</p>' for index, paragraph in enumerate(paragraphs))    
    return formatted_text

def get_chunk_transcript(chunk, initial_offset):
    with NamedTemporaryFile(delete=True, suffix=".mp4") as temp_segment:
        chunk.export(temp_segment.name, format="mp4")  # Adjust the format as needed
        headers = {
            'x-gladia-key': '2c1c6dc9-6adb-47ec-9296-eca84c7d0f8c',
        }
        files = {
            'audio': (temp_segment.name, open(temp_segment.name, 'rb'), 'audio/mp4'),
        }
        print(files)
        response = requests.post('https://api.gladia.io/audio/text/audio-transcription/', headers=headers, files=files)
        response_json = response.json()
        #response_json = json.load(open('output_file.json'))
        return add_paragraph_tags(get_formatted_transcript(get_lines_from_response(response_json, initial_offset), get_timestamp=True))
        
async def transcribe_audio_file(file: UploadFile): 
    with NamedTemporaryFile(delete=True) as temp_file:
        file_content = await file.read()
        # Write the input .mp4 data to a temporary file
        temp_file.write(file_content)
        temp_file.flush()
        
        audio = AudioSegment.from_file(temp_file.name)
        chunk_duration = 900 * 1000  # 300 seconds (in milliseconds)
        chunks = make_chunks(audio, chunk_duration)

        for i in range(0,len(chunks)):
            transcript = get_chunk_transcript(chunks[i], int(i*chunk_duration/1000))
            print(transcript)
            yield transcript

@app.post(path="/back_end_upload_file")
async def get_upload_file_transcript(file: UploadFile):
    if file.content_type == "application/pdf":
        # Create a temporary file to save the uploaded PDF
        text = ""
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=True) as temp_file:
        
            temp_file.write(file.file.read())
            temp_file.flush()
            text = extract_text(temp_file.name)
            text = add_paragraph_tags(text)
        print(text)
        return text
    
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
    
@app.websocket("/back_end_stream_audio")
async def websocket_endpoint(front_end_socket: WebSocket):
    print("inside websocket_endpoint")
    await front_end_socket.accept()

    gladia_url = "wss://api.gladia.io/audio/text/audio-transcription"
    ws = websocket.WebSocket()
    ws.connect(gladia_url)
    configuration = {
        "x_gladia_key": "2c1c6dc9-6adb-47ec-9296-eca84c7d0f8c",
    }
    ws.send(json.dumps(configuration))
    while True:
        data = await front_end_socket.receive_bytes()
        send = ws.send(json.dumps({
            "frames": base64.b64encode(data).decode('utf-8'),
        }))
        print(send)
        print(ws.recv())


@app.get("/back_end")
async def root():
    return {"message": "Hello World"}

