# Use the official Ubuntu 18.04 base image
FROM ubuntu:18.04

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install --upgrade pip

# Set environment variable
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /backend

# Copy requirements.txt and install Python dependencies
COPY ./requirements.txt /backend/requirements.txt
RUN pip3 install -r requirements.txt

# Install additional dependencies
RUN apt-get update && apt-get -y install ffmpeg libavcodec-extra

# Copy the rest of the application's code to the container
COPY . /backend

# Specify the command to run your application
CMD ["uvicorn", "main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8080"]
