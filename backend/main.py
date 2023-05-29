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
