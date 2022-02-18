source secret.env

ssh -i $DEPLOYMENT_KEY_PATH $DEPLOYMENT_USER@$DEPLOYMENT_HOST "journalctl -u $APP_NAME.service"

