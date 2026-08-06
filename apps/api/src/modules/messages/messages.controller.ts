import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { DataScopeService } from '../../common/data-scope.service';
import { AuthService } from '../auth/auth.service';
import { MessagesService } from './messages.service';

// Inbox-style summary views for the "Contact Us" page and the topbar unread
// badge. Per-member thread read/write lives on MembersController
// (GET/POST /members/:memberId/messages) and MeController (member-side) —
// kept there rather than here to avoid this controller's static
// "conversations" routes ever colliding with a "/messages/:memberId" param
// route.
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly authService: AuthService,
    private readonly messagesService: MessagesService,
    private readonly dataScopeService: DataScopeService,
  ) {}

  @Get('conversations')
  async listConversations(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      conversations: await this.messagesService.listConversationsForTenant(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  @Get('conversations/unread-count')
  async getUnreadCount(@Req() request: Request) {
    const session = await this.getRequiredSession(request.headers.cookie);
    const branchId = await this.dataScopeService.resolveBranchId(session.user);
    return {
      unreadCount: await this.messagesService.countUnreadForTenant(
        session.user.tenant.id,
        branchId,
      ),
    };
  }

  private async getRequiredSession(cookieHeader: string | undefined) {
    const session =
      await this.authService.getCurrentSessionFromCookieHeader(cookieHeader);
    if (!session) {
      throw new UnauthorizedException('Authentication required.');
    }
    return session;
  }
}
