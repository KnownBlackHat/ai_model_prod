#!/bin/bash
cd ai_model_prod
sudo docker-compose down --remove-orphans;
cd ..
rm -rf ai_model_prod
