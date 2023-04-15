#!/bin/bash
echo "======================================================"
echo "Starting Distributed Cache Demonstration..."
echo "======================================================"
docker compose up --build --abort-on-container-exit
echo "======================================================"
echo "Demonstration Finished. Cleaning up containers..."
echo "======================================================"
docker compose down
