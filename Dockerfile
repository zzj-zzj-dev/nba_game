# 使用 PocketBase 官方镜像
FROM alpine:latest

# 下载 PocketBase
RUN apk add --no-cache curl unzip
RUN curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.22.21/pocketbase_0.22.21_linux_amd64.zip -o pb.zip \
    && unzip pb.zip \
    && rm pb.zip \
    && chmod +x pocketbase

# 复制前端文件
COPY . /pb_public

# 暴露端口
EXPOSE 8080

# 启动 PocketBase，自动服务静态文件
CMD ["./pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=/pb_data", "--publicDir=/pb_public"]
