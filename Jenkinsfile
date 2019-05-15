pipeline {
    agent none
    stages {
        stage ('Start') {
            steps {
                slackSend (color: '#439FE0', message: "Build Started: '${env.JOB_NAME} - #${env.BUILD_NUMBER}' (<${env.BUILD_URL}|Open>)")
            }
        }
        stage('Retrieve new code') {

            steps {
                node('master') {
                    git credentialsId: 'git', url: 'ssh://git@bitbucket.org:blah'
                }
            }
        }
        stage('get changes and restart ticket service'){
            steps {
                node('master') {
                    sshPublisher(publishers: [sshPublisherDesc(configName: 'Reerticket - DEV (Amazon Lightsail)', transfers: [sshTransfer(excludes: '', execCommand: 'cd /home/bitnami/stack/apps/reer-ticket && git checkout -- package-lock.json && git pull git@bitbucket.org:blah.git master && npm install && sudo pm2 reload ticket-api', execTimeout: 120000, flatten: false, makeEmptyDirs: false, noDefaultExcludes: false, patternSeparator: '[, ]+', remoteDirectory: '', remoteDirectorySDF: false, removePrefix: '', sourceFiles: '')], usePromotionTimestamp: false, useWorkspaceInPromotion: false, verbose: false)])
                    sshPublisher(publishers: [sshPublisherDesc(configName: 'Reerticket - PROD (Amazon Lightsail)', transfers: [sshTransfer(excludes: '', execCommand: 'cd /home/bitnami/stack/apps/reer-ticket && git checkout -- package-lock.json && git pull git@bitbucket.org:blah.git master && npm install && sudo pm2 reload ticket-api', execTimeout: 120000, flatten: false, makeEmptyDirs: false, noDefaultExcludes: false, patternSeparator: '[, ]+', remoteDirectory: '', remoteDirectorySDF: false, removePrefix: '', sourceFiles: '')], usePromotionTimestamp: false, useWorkspaceInPromotion: false, verbose: false)])
                }
            }
        }
    }
    post {
        always {
            script{
                def COLOR_MAP = ['SUCCESS': '#00FF00', 'FAILURE': '#FF0000', 'UNSTABLE': '#FFFF00', 'ABORTED': '#808080']
                def STATUS_MAP = ['SUCCESS': 'successful', 'FAILURE': 'failed', 'UNSTABLE': 'unstable', 'ABORTED': 'aborted']

                slackSend (color: '${COLOR_MAP[currentBuild.currentResult]}', message: "Build ${STATUS_MAP[currentBuild.currentResult]}: '${env.JOB_NAME} - #${env.BUILD_NUMBER}' (<${env.BUILD_URL}|Open>)")
            }
        }
    }
}
