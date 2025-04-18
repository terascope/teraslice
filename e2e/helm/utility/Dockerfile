FROM debian:stable-slim
WORKDIR /root
COPY fake_stream.sh /root
RUN apt update && apt install -y iputils-ping curl kcat vim jq && apt-get clean \
    && chmod +x /root/fake_stream.sh
CMD ["tail", "-f", "/dev/null"]
