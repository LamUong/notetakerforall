# Use the official Ubuntu 18.04 base image
FROM ubuntu:18.04
# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip
ENV PYTHONUNBUFFERED=1
WORKDIR /backend
RUN pip install --upgrade pip
COPY ./requirements.txt /backend/requirements.txt
RUN pip install -r requirements.txt
RUN apt-get update && apt-get -y install ffmpeg libavcodec-extra
COPY . /backend

CMD ["uvicorn", "main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8080"]

