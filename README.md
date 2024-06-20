# RabbitMQ Worker

Aplikasi ini adalah sebuah worker yang mengonsumsi pesan dari RabbitMQ dan melakukan pengolahan data sesuai kebutuhan.

## Deskripsi

Aplikasi ini dikembangkan menggunakan Node.js dan mengambil data dari antrian RabbitMQ untuk diproses. Worker ini dapat digunakan untuk berbagai tujuan, seperti pengolahan pesan sensor, pemrosesan antrian pesan, dan lain sebagainya.

## Instalasi

1. Clone repositori ini ke dalam sistem lokal Anda:

    ```bash
    git clone <URL repositori>
    ```

2. Masuk ke dalam direktori aplikasi:

    ```bash
    cd rabbitmq-worker
    ```

3. Install dependensi yang diperlukan dengan menggunakan npm:

    ```bash
    npm install
    ```

## Setup .env

Pastikan untuk membuat file .env di dalam direktori aplikasi dan mengisi variabel lingkungan yang diperlukan. Berikut adalah contoh isi dari file .env:

# Variabel untuk koneksi ke RabbitMQ
RMQ_HOST=localhost
RMQ_USER=guest
RMQ_PASS=guest
RMQ_PORT=5672
RMQ_VHOST=/

# Nama antrian RabbitMQ
QUE=my_queue

# Variabel untuk koneksi ke MongoDB
MONGODB_URI=mongodb://localhost:27017/my_database



