FROM python:3.8-slim-buster
ENV PYTHONUNBUFFERED=1
WORKDIR /backend
RUN pip install --upgrade pip
COPY ./requirements.txt /backend/requirements.txt
RUN pip install -r requirements.txt
RUN apt-get update && apt-get -y install ffmpeg libavcodec-extra
COPY . /backend

CMD ["uvicorn", "main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8080"]

