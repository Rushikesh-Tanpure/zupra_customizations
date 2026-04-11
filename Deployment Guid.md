cp example.env .env

Move the Docker and docker-compose.yml to frappe-docker

run below command

docker compose up -d --force-recreate assets-init && sleep 15 && docker compose logs assets-init | grep -i "zupra\|linking\|error"

if any issues run this once

docker compose restart backend

if any problems with file names or hash verify using the

docker compose exec backend ls /home/frappe/frappe-bench/sites/assets/erpnext/dist/css/

docker compose exec backend cat /home/frappe/frappe-bench/sites/assets/assets.json | python3 -m json.tool | grep -i erpnext.bundle

and fix using the

docker compose stop frontend backend
docker volume rm frappe_docker_assets
docker compose up -d

if any error while executing this commands

docker compose down && docker volume rm frappe_docker_assets && docker compose up -d

This forces assets-init to rebuild from scratch, producing fresh CSS files and a matching assets.json. After it starts, verify:

docker compose exec backend cat /home/frappe/frappe-bench/sites/assets/assets.json | python3 -m json.tool | grep -i erpnext.bundle
docker compose exec backend ls /home/frappe/frappe-bench/sites/assets/erpnext/dist/css/
