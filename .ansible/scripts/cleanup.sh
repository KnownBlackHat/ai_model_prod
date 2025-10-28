#!/bin/bash
cd ~
cd ai_model_prod
sudo docker-compose down;
cd ..
rm -rf ai_model_prod
