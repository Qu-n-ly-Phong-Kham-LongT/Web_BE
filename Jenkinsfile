pipeline {
    agent any

    environment {
        APP_NAME = "phong-kham"
        COMPOSE_FILE_PATH = "./infra/docker-compose.yml"
        // --env-file: compose đọc .env.runtime cho cả phần interpolation ${...}
        // (ports, container_name, image tag). Không cần sinh thêm file .env nào.
        COMPOSE_ENV_FILE = "./infra/.env.runtime"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Initialize') {
            steps {
                script {
                    def BR = env.BRANCH_NAME
                    echo "[Init] Branch = ${BR}"

                    // Toàn bộ PORT (PORT, CORE_PORT, POSTGRES_HOST_PORT) khai
                    // báo trong credential file, KHÔNG để ở đây nữa. Compose
                    // đọc chúng qua cờ --env-file.
                    def branchMap = [
                        "product": [
                            envName: "product",
                            credId : "env-phong-kham-product"
                        ],
                        "staging": [
                            envName: "staging",
                            credId : "env-phong-kham-staging"
                        ]
                    ]

                    def cfg = branchMap[BR]
                    if (cfg == null) {
                        error("Branch '${BR}' chua duoc cau hinh deploy. " +
                              "Chi build: ${branchMap.keySet().join(', ')}")
                    }

                    env.ENVIRONMENT_NAME = cfg.envName
                    env.ENV_CRED_ID      = cfg.credId

                    env.COMPOSE_PROJECT = "${APP_NAME}-${cfg.envName}"
                    env.CORE_IMAGE_TAG = "${APP_NAME}-core:${ENVIRONMENT_NAME}-${BUILD_NUMBER}"
                    env.PDF_IMAGE_TAG  = "${APP_NAME}-pdf:${ENVIRONMENT_NAME}-stable"

                    echo "[Init] ENVIRONMENT = ${ENVIRONMENT_NAME}"
                    echo "[Init] PROJECT    = ${COMPOSE_PROJECT}"
                    echo "[Init] CORE_IMAGE = ${CORE_IMAGE_TAG}"
                    echo "[Init] PDF_IMAGE  = ${PDF_IMAGE_TAG}"
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Detect PDF changes') {
            steps {
                script {
                    def pdfChanged = (sh(script: """
                        set -e
                        BASE="\${GIT_PREVIOUS_SUCCESSFUL_COMMIT:-HEAD~1}"
                        git diff --name-only "\$BASE" HEAD | grep -E '^pdf/' >/dev/null && echo yes || echo no
                    """, returnStdout: true).trim() == "yes")

                    def pdfImageExists = (sh(script: """
                        docker image inspect ${env.PDF_IMAGE_TAG} >/dev/null 2>&1 && echo yes || echo no
                    """, returnStdout: true).trim() == "yes")

                    env.BUILD_PDF = (pdfChanged || !pdfImageExists) ? "true" : "false"
                    echo "[Detect] BUILD_PDF = ${env.BUILD_PDF}"
                }
            }
        }

        stage('Build images') {
            steps {
                sh """
                    set -e
                    echo "[Build] Core image"
                    docker build -t ${CORE_IMAGE_TAG} ./core

                    if [ "${BUILD_PDF}" = "true" ]; then
                        echo "[Build] PDF image"
                        docker build -t ${PDF_IMAGE_TAG} ./pdf
                    else
                        echo "[Build] Skip PDF (reuse stable)"
                    fi
                """
            }
        }

        // Postgres + RabbitMQ phải sống TRƯỚC khi migrate và trước khi core lên.
        // Hai service này KHÔNG bị --force-recreate ở stage Deploy nên dữ liệu
        // và uptime giữ nguyên qua mỗi lần build.
        stage('Start infrastructure') {
            steps {
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh """
                        set -e

                        docker network inspect at-net >/dev/null 2>&1 || docker network create at-net
                        mkdir -p "/data/${APP_NAME}/${ENVIRONMENT_NAME}/public"

                        # core chay bang user nodeuser (core/Dockerfile: USER nodeuser),
                        # con mkdir o tren tao thu muc thuoc root -> upload file se bi
                        # Permission denied. Chay 1 container root tam de chown lai.
                        docker run --rm --user root \\
                            -v "/data/${APP_NAME}/${ENVIRONMENT_NAME}/public:/mnt" \\
                            ${CORE_IMAGE_TAG} chown -R nodeuser:nodegrp /mnt

                        # Credential file nằm ở đường dẫn tạm ngẫu nhiên, phải copy về
                        # đúng ./infra/.env.runtime vì compose ghi cứng đường dẫn này.
                        # sed: bỏ \\r nếu file được soạn trên Windows.
                        cp "\$ENV_FILE" ./infra/.env.runtime
                        chmod 600 ./infra/.env.runtime
                        sed -i 's/\\r\$//' ./infra/.env.runtime
                        rm -f ./infra/.env

                        # --wait: chờ tới khi cả 2 healthy rồi mới sang stage sau
                        echo "[Infra] Start postgres + rabbitmq"
                        docker compose --env-file ${COMPOSE_ENV_FILE} -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE_PATH} \\
                            up -d --wait postgres rabbitmq

                        rm -f ./infra/.env.runtime
                    """
                }
            }
        }

        stage('Migrate Database (core)') {
            steps {
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh """
                        set -e
                        cp "\$ENV_FILE" ./infra/.env.runtime
                        chmod 600 ./infra/.env.runtime
                        sed -i 's/\\r\$//' ./infra/.env.runtime

                        docker compose --env-file ${COMPOSE_ENV_FILE} --profile tools -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE_PATH} run --rm migrate

                        rm -f ./infra/.env.runtime
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh """
                        set -e
                        cp "\$ENV_FILE" ./infra/.env.runtime
                        chmod 600 ./infra/.env.runtime
                        sed -i 's/\\r\$//' ./infra/.env.runtime

                        echo "[Deploy] Stopping old containers if exist..."
                        docker stop phong-kham-core-${ENVIRONMENT_NAME} phong-kham-pdf-${ENVIRONMENT_NAME} 2>/dev/null || true
                        docker rm   phong-kham-core-${ENVIRONMENT_NAME} phong-kham-pdf-${ENVIRONMENT_NAME} 2>/dev/null || true

                        # --no-deps: chỉ dựng lại core/pdf, KHÔNG đụng tới postgres
                        echo "[Deploy] Starting core + pdf..."
                        docker compose --env-file ${COMPOSE_ENV_FILE} -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE_PATH} \\
                            up -d --force-recreate --no-deps --remove-orphans core pdf

                        docker compose --env-file ${COMPOSE_ENV_FILE} -p ${COMPOSE_PROJECT} -f ${COMPOSE_FILE_PATH} ps

                        rm -f ./infra/.env.runtime
                        echo "[Deploy] Done"
                    """
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh """
                    echo "[Cleanup] Remove old core images (keep 5)"
                    docker images --format "{{.Repository}}:{{.Tag}}" \
                        | grep "${APP_NAME}-core:${ENVIRONMENT_NAME}-" \
                        | grep -v "${CORE_IMAGE_TAG}" \
                        | tail -n +6 \
                        | xargs -r docker rmi -f || true

                    docker image prune -f || true
                """
            }
        }
    }

    post {
        always {
            // Không để lộ file env nếu pipeline fail giữa chừng
            sh 'rm -f ./infra/.env.runtime ./.env.runtime || true'
            echo "Pipeline finished for branch ${env.BRANCH_NAME}"
        }
    }
}
