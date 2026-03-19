import { Injectable } from '@nestjs/common';
import { Child, Reddit } from 'src/modules/reddit/interfaces/reddit.interface';
import { SimpleReddit } from 'src/modules/reddit/interfaces/simple-reddit.interface';

@Injectable()
export class MapperResponseRedditUtil {
  private readonly regex = /[A-Z0-9]{5}(?:-[A-Z0-9]{5}){4}/g;

  mapToRedditPostArray(data: Reddit): SimpleReddit[] {
    return data.data.children.map((child) => this.mapToRedditPost(child));
  }

  mapToRedditPost(data: Child): SimpleReddit {
    return {
      title: data.data.title,
      url: data.data.url,
      text: data.data.selftext,
      author: data.data.author,
      created_utc: data.data.created_utc,
      keys: this.filterKeys(data.data.selftext),
    };
  }

  private filterKeys(text: string): string[] {
    return text.match(this.regex) || [];
  }

  filterPostsWithKeys(posts: SimpleReddit[]): SimpleReddit[] {
    return posts.filter((post) => post.keys.length > 0);
  }
}
