import { Module } from '@nestjs/common';
import { RedditService } from './reddit.service';
import {
  AxiosClientFactory,
  RedditAxiosClient,
} from '../shared/http/axios-client.factory';
import { MapperResponseRedditUtil } from './utils/mapper-response-reddit.util';

@Module({
  controllers: [],
  providers: [
    RedditService,
    AxiosClientFactory,
    RedditAxiosClient,
    MapperResponseRedditUtil,
  ],
  exports: [RedditService],
})
export class RedditModule {}
