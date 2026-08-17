import { Module } from '@nestjs/common';

import { DeleteTimerController } from './delete-timer/delete-timer.controller';
import { GetTimerController } from './get-timer/get-timer.controller';
import { PauseTimerController } from './pause-timer/pause-timer.controller';
import { PauseTimerService } from './pause-timer/pause-timer.service';
import { ResumeTimerController } from './resume-timer/resume-timer.controller';
import { StartTimerController } from './start-timer/start-timer.controller';
import { StartTimerService } from './start-timer/start-timer.service';
import { TimerRepository } from './timer.repository';

@Module({
  controllers: [
    GetTimerController,
    StartTimerController,
    PauseTimerController,
    ResumeTimerController,
    DeleteTimerController,
  ],
  providers: [TimerRepository, StartTimerService, PauseTimerService],
})
export class TimerModule {}
