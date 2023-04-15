@echo off
echo ======================================================
echo Starting Distributed Cache Demonstration...
echo Both microservices (Catalog and Recommendation) will boot up
echo and coordinate a series of reads and writes via Redis.
echo ======================================================
docker compose up --build --abort-on-container-exit
echo ======================================================
echo Demonstration Finished. Cleaning up containers...
echo ======================================================
docker compose down
pause
