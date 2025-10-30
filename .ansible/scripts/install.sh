#!/bin/bash
git clone https://github.com/KnownBlackHat/ai_model_prod --depth=1;
cd ai_model_prod;
cp /tmp/docker-compose.yaml .;
sudo docker-compose build backend;
sudo docker-compose up --scale backend=6 -d;
