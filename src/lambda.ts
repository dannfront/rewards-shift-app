import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CronJobService } from './modules/cron-job/cron-job.service';

export const handler = async (event: any) => {
  //  contexto de la aplicación (sin levantar el servidor HTTP)
  const appContext = await NestFactory.createApplicationContext(AppModule);

  //  instancia de tu servicio de Cron
  const cronService = appContext.get(CronJobService);

  try {
    // se ejececuta la logica del cron
    await cronService.handleCron();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Cron ejecutado con éxito' }),
    };
  } catch (error) {
    console.error('Error ejecutando el cron:', error);
    throw error;
  } finally {
    // cerramos el contexto
    await appContext.close();
  }
};
