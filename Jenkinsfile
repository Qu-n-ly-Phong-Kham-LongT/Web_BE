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
                    def BR = env.BRANCH_NAME
                    echo "[Init] Branch = ${BR}"

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

                    env.ENVIRONMENT_NAME = branchMap[BR].envName
                    env.ENV_CRED_ID      = branchMap[BR].credId

                    env.CORE_IMAGE_TAG = "${APP_NAME}-core:${ENVIRONMENT_NAME}-${BUILD_NUMBER}"
                    env.PDF_IMAGE_TAG  = "${APP_NAME}-pdf:${ENVIRONMENT_NAME}-stable"

                    echo "[Init] ENVIRONMENT = ${ENVIRONMENT_NAME}"
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

        stage('Migrate Database (core)') {
            steps {
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh """
                        set -e
                        cp "\$ENV_FILE" ./.env.runtime
                        docker run --rm --env-file ./.env.runtime ${CORE_IMAGE_TAG} npx prisma migrate deploy
                        rm -f ./.env.runtime
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
                    sh """
                        set -e
                        cp "\$ENV_FILE" ./.env.runtime

                        docker network inspect at-net >/dev/null 2>&1 || docker network create at-net

                        HOST_PUBLIC_DIR="/data/${APP_NAME}/${ENVIRONMENT_NAME}/public"
                        mkdir -p "\$HOST_PUBLIC_DIR"

                        cp ./.env.runtime ./infra/.env.runtime

                        docker compose -p ${APP_NAME}-${ENVIRONMENT_NAME} -f ./infra/docker-compose.yml up -d --force-recreate --remove-orphans

                        rm -f ./.env.runtime ./infra/.env.runtime
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
            echo "Pipeline finished for branch ${env.BRANCH_NAME}"
        }
    }
}