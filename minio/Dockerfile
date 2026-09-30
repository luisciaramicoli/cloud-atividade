# Atividade 6: MinIO (object storage) compilado a partir do código-fonte público.
# A MinIO Inc. descontinuou em 2025 a distribuição gratuita das imagens prontas (Docker Hub
# minio/minio, Quay e o binário em dl.min.io passaram a exigir login/assinatura). O servidor
# continua open-source (AGPLv3) no GitHub, então compilamos nós mesmos a partir de uma tag
# de release fixa, sem depender de nenhum registro de imagem de terceiros.
FROM golang:1.24-bookworm AS build
ARG MINIO_VERSION=RELEASE.2025-09-07T16-13-09Z
WORKDIR /src
RUN git clone --depth 1 --branch ${MINIO_VERSION} https://github.com/minio/minio.git . \
    && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -tags kqueue -trimpath -o /out/minio .

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /out/minio /usr/bin/minio
RUN chmod +x /usr/bin/minio

VOLUME ["/data"]
EXPOSE 9000 9001
ENTRYPOINT ["minio"]
CMD ["server", "/data", "--console-address", ":9001"]
