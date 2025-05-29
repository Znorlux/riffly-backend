import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  profileImage?: string;
  bio?: string;
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
