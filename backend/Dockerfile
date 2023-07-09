FROM python:3.9-bullseye

# Set environment variable
ENV PYTHONUNBUFFERED=1

ARG FFMPEG_VERSION=4.4

RUN apt-get update && apt-get install -y wget gnupg2
RUN echo "deb http://deb.debian.org/debian buster-backports main" >> /etc/apt/sources.list
RUN apt-get update && apt-get install -y ffmpeg=4.4

# Set the working directory in the container
WORKDIR /backend

RUN pip install --upgrade pip

# Copy requirements.txt and install Python dependencies
COPY ./requirements.txt /backend/requirements.txt
RUN pip install -r requirements.txt

# Copy the rest of the application's code to the container
COPY . /backend

# Specify the command to run your application
CMD ["uvicorn", "main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8080"]
