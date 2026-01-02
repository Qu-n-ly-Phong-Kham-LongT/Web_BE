import app from './app';
import ENV from './config/environment.config';

app.listen(ENV.port, () => {
  console.log(`Server running on port ${ENV.port}`);
});
