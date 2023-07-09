FROM python:3.12-rc-bookworm

# Set environment variable
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /backend

RUN pip install --upgrade pip

RUN apt-get update && apt-get -y install ffmpeg libavcodec-extra

# Copy requirements.txt and install Python dependencies
COPY ./requirements.txt /backend/requirements.txt
RUN pip install -r requirements.txt

# Copy the rest of the application's code to the container
COPY . /backend

# Specify the command to run your application
CMD ["uvicorn", "main:app", "--proxy-headers", "--host", "0.0.0.0", "--port", "8080"]
