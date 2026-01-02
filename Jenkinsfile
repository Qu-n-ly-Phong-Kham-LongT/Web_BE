pipeline {
    agent any

    environment {
        APP_NAME = "phong-kham"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Initialize') {
            steps {
                script {

                    def BR = (env.BRANCH_NAME)

                    echo "[Init] Detected branch: ${BR}"

                    def branchMap = [
                        "product": [
                            envName: "product",
                            credId : "env-phong-kham-product",
                            port   : "5000"
                        ],
                        "staging": [
                            envName: "staging",
                            credId : "env-phong-kham-staging",
                            port   : "5001"
                        ]
                    ]


                    env.ENVIRONMENT_NAME = branchMap[BR].envName
                    env.ENV_CRED_ID      = branchMap[BR].credId
                    env.IMAGE_TAG        = "${env.APP_NAME}:${env.ENVIRONMENT_NAME}-${env.BUILD_NUMBER}"
                    env.APP_PORT = branchMap[BR].port

                    echo "[Init] ENVIRONMENT_NAME = ${env.ENVIRONMENT_NAME}"
                    echo "[Init] IMAGE_TAG        = ${env.IMAGE_TAG}"
                    echo "[Init] ENV_CRED_ID      = ${env.ENV_CRED_ID}"
                    echo "[Init] APP_PORT         = ${env.APP_PORT}"
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
                echo "[${env.ENVIRONMENT_NAME}] Code checked out."
            }
        }

        stage('Build') {
            steps {
                echo "[${env.ENVIRONMENT_NAME}] Building Docker image…"

                sh """
                    DOCKER_BUILDKIT=1 docker build --pull \
                        -t ${env.IMAGE_TAG} .
                """

                echo "[Build] Completed → ${env.IMAGE_TAG}"
            }
        }

        stage('Test & Scan') {
            steps {
                echo "[${env.ENVIRONMENT_NAME}] Unit test, Sonar, Trivy scan (optional)…"
            }
        }

        stage('Migrate Database') {
            steps {
                echo "[${env.ENVIRONMENT_NAME}] Running Prisma migrations…"

                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh """
                        echo "--- Copying .env for migrations"
                        cp "\$ENV_FILE" ./.env.migrate

                        echo "--- Running Prisma migrate deploy"
                        docker run --rm \
                            --env-file ./.env.migrate \
                            ${env.IMAGE_TAG} \
                            npx prisma migrate deploy

                        echo "--- Cleaning up .env.migrate"
                        rm -f ./.env.migrate
                    """
                }

                echo "[Migrate] Database migrations completed."
            }
        }

        stage('Deploy') {
        steps {
            withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
            sh """
                set -e

                echo "--- Copying .env from Jenkins credentials"
                cp "\$ENV_FILE" ./.env.deploy

                APP_NAME_UNIQUE="${APP_NAME}-${ENVIRONMENT_NAME}"
                HOST_PUBLIC_DIR="/data/${APP_NAME}/${ENVIRONMENT_NAME}/public"

                echo "--- Prepare host public folder (no subfolders)"
                mkdir -p "\$HOST_PUBLIC_DIR"

                # Lấy UID/GID của user chạy app trong container
                APP_UID=\$(docker run --rm ${IMAGE_TAG} sh -lc 'id -u')
                APP_GID=\$(docker run --rm ${IMAGE_TAG} sh -lc 'id -g')
                echo "--- Container UID:GID = \$APP_UID:\$APP_GID"

                # Chuẩn hoá quyền host folder theo UID/GID container
                docker run --rm -v /data/${APP_NAME}/${ENVIRONMENT_NAME}:/mnt alpine:3.20 sh -lc "
                set -e
                install -d -m 775 -o \$APP_UID -g \$APP_GID /mnt/public
                "

                echo "--- Stopping old container"
                docker rm -f \${APP_NAME_UNIQUE} 2>/dev/null || true

                echo "--- Starting new container"
                docker run -d \
                --name ${APP_NAME_UNIQUE} \
                --restart unless-stopped \
                --env-file ./.env.deploy \
                -p ${APP_PORT}:${APP_PORT} \
                -v "$HOST_PUBLIC_DIR:/app/public:rw" \
                ${IMAGE_TAG}

                echo "--- Deploy OK"
                rm -f ./.env.deploy
            """
            }
        }
        }

        stage('Cleanup') {
            steps {
                sh """
                    echo "--- Cleaning old images (keep latest)"
                    OLD_IMAGES=\$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "${APP_NAME}" | grep -v "${IMAGE_TAG}" || true)

                    for IMG in \$OLD_IMAGES; do
                        echo "Deleting: \$IMG"
                        docker rmi -f \$IMG || true
                    done

                    docker image prune -f || true
                """
            }
        }
    }

    post {
        always {
            echo "Pipeline finished for branch ${env.BRANCH_NAME}."
        }
    }
}