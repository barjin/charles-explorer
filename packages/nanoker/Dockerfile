## install the pip requirements and run thw src/server.py file

FROM python:3.7-slim
ADD ./requirements.txt /app/requirements.txt
WORKDIR /app
RUN pip install -r requirements.txt

ADD . /app
EXPOSE 8547
CMD ["python", "src/server.py"]
