from fastapi import FastAPI, Request, WebSocket, UploadFile
from tempfile import NamedTemporaryFile
from fastapi.responses import HTMLResponse
from typing import Dict, Callable
from deepgram import Deepgram
from dotenv import load_dotenv
import asyncio
import os
import shutil
from io import BytesIO
import json
from fastapi.middleware.cors import CORSMiddleware
import openai
import time

load_dotenv()

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

dg_client = Deepgram("39a146d814142a35358db89c15a936727975bcb6")

openai.my_api_key = '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'

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

def get_outline(input_text):
    prompt = f"The following is a transcription of a video which might have timestamps in seconds:\n\n{input_text}\n\n . If there are timestamps please make sure to keep the timestamps in seconds from the original input text. Then, please provide an outline of the content while mentioning the important timestamps, if they exist, in this example format: 'At timestamp <time_stamp>,'."
    message = [{"role": "system", "content": prompt}]
    response = get_gpt_chat_response(message)
    return response

def get_title(input_text):
    prompt = f"The following is a transcription of a video:\n\n{input_text}\n\n . Please provide a Title for the content."
    message = [{"role": "system", "content": prompt}]
    response = get_gpt_chat_response(message)
    return response

def get_summary(input_text):
    prompt = f"The following is a transcription of a video:\n\n{input_text}\n\n . Please provide a Summary for the content."
    message = [{"role": "system", "content": prompt}]
    response = get_gpt_chat_response(message)
    return response

def get_bullet_points(input_text):
    prompt = f"The following is a transcription of a video:\n\n{input_text}\n\n . Can you keep all the sentences that contain specific details and output them in bullet points?"
    message = [{"role": "system", "content": prompt}]
    response = get_gpt_chat_response(message)
    return response

def get_chat_response(input_text, input_type):
    if input_type == 'Title':
        return get_title(input_text)
    if input_type == 'Summary':
        return get_summary(input_text) 
    if input_type == 'BulletPoints':
        return get_bullet_points(input_text) 
    if input_type == 'Outline':
        return get_outline(input_text) 

async def process_audio(fast_socket: WebSocket):
    async def get_transcript(data: Dict) -> None:
        if 'channel' in data:
            transcript = data['channel']['alternatives'][0]['transcript']
        
            if transcript:
                await fast_socket.send_text(transcript)

    deepgram_socket = await connect_to_deepgram(get_transcript)

    return deepgram_socket

async def connect_to_deepgram(transcript_received_handler: Callable[[Dict], None]):
    try:
        socket = await dg_client.transcription.live({'punctuate': True, 'interim_results': False})
        socket.registerHandler(socket.event.CLOSE, lambda c: print(f'Connection closed with code {c}.'))
        socket.registerHandler(socket.event.TRANSCRIPT_RECEIVED, transcript_received_handler)
        
        return socket
    except Exception as e:
        raise Exception(f'Could not open socket: {e}')
 
@app.get("/", response_class=HTMLResponse)
def get(request: Request):
    return {"hi": "hi there"}

@app.websocket("/listen")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        deepgram_socket = await process_audio(websocket) 

        while True:
            data = await websocket.receive_bytes()
            deepgram_socket.send(data)
    except Exception as e:
        raise Exception(f'Could not process audio: {e}')
    finally:
        await websocket.close()

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

def get_transcribed_text(response):
    results = {
        'paragraphs': [],
        'transcript': '',
        'transcript_with_ts': '',
        'transcript_with_ts_and_speaker': ''
    }
    
    paragraphs = response['results']['channels'][0]['alternatives'][0]['paragraphs']['paragraphs']
    for paragraph in paragraphs:
        paragraph_data = {
            'speaker': paragraph['speaker'],
            'start': int(paragraph['start']),
            'end': int(paragraph['end']),
            'text': ' '.join(sentence['text'] for sentence in paragraph['sentences'])
        }
        results['paragraphs'].append(paragraph_data)
    
    processed_paragraphs = results['paragraphs']
    results['transcript'] = get_formatted_transcript(processed_paragraphs)
    results['transcript_with_ts'] = get_formatted_transcript(processed_paragraphs, get_timestamp=True)
    results['transcript_with_ts_and_speaker'] = get_formatted_transcript(processed_paragraphs, get_timestamp=True, get_speaker=True)
    
    return results

@app.post(path="/upload_file")
async def transcribe_audio_file(file: UploadFile):
    with NamedTemporaryFile(delete=True) as temp_file:
        file_content = await file.read()
        file_buffer = BytesIO(file_content)
        print("file.content_type")
        print(file.content_type)
        source = {'buffer': file_buffer, 'mimetype': file.content_type}
        # Send the audio to Deepgram and get the response
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
        return get_transcribed_text(response)

@app.post(path="/mock_upload_file")
async def transcribe_audio_file(file: UploadFile):
    with open('output_file.json') as json_file:
        response = json.load(json_file)
        return get_transcribed_text(response)
 

@app.websocket("/stream_chat")
async def stream(websocket: WebSocket):
    await websocket.accept()
    
    # Receive message from the WebSocket
    data = await websocket.receive_text()
    print(f"Received: {data}")

    answer = ""
    response = get_chat_response(data['input_text'], data['input_type'])

    for chunk in response:
        chunk_message = chunk["choices"][0]["delta"]  # extract the message
        if "content" in chunk_message:
            answer += chunk_message["content"]
        await websocket.send_text(f"Streamed data {answer}")

    await websocket.close()
        
