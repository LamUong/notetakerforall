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

load_dotenv()

app = FastAPI()

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
 
@app.post(path="/upload_file")
async def transcribe_audio_file(file: UploadFile):
    with NamedTemporaryFile(delete=True) as temp_file:
        print("in")
        file_content = await file.read()
        file_buffer = BytesIO(file_content)
        print("file.content_type")
        print(file.content_type)
        source = {'buffer': file_buffer, 'mimetype': file.content_type}
        # Send the audio to Deepgram and get the response
        response = await dg_client.transcription.prerecorded(
                      source,
                      {
                        'punctuate': True,
                         'model': 'whisper-large',
                      }
                    )
        print(response['results']['channels'][0]['alternatives'][0]['transcript'])
        #print(json.dumps(response, indent=4))

