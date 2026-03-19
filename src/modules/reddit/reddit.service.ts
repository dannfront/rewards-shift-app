import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RedditAxiosClient } from '../shared/http/axios-client.factory';
import { Reddit } from './interfaces/reddit.interface';
import { MapperResponseRedditUtil } from './utils/mapper-response-reddit.util';
import { SimpleReddit } from './interfaces/simple-reddit.interface';

@Injectable()
export class RedditService {
  private readonly logger = new Logger(RedditService.name);
  constructor(
    private readonly redditAxiosClient: RedditAxiosClient,
    private readonly mapperResponseRedditUtil: MapperResponseRedditUtil,
  ) {}

  async fetchRedditPosts(): Promise<SimpleReddit[]> {
    try {
      const response = await this.redditAxiosClient.get<Reddit>();
      const dataResponse = (response as { data: Reddit }).data;
      const posts =
        this.mapperResponseRedditUtil.mapToRedditPostArray(dataResponse);
      return this.mapperResponseRedditUtil.filterPostsWithKeys(posts);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        'Error al obtener los posts de Reddit',
      );
    }
  }
}
