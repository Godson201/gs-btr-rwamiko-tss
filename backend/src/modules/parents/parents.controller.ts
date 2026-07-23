import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AuthenticatedUser } from '../auth/auth.types';
import { ParentsService } from './parents.service';

@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  findAll() {
    return this.parentsService.findAll();
  }

  @Get('me/children')
  @Roles(Role.PARENT)
  findMyChildren(@CurrentUser() user: AuthenticatedUser) {
    return this.parentsService.findMyChildren(user.id);
  }
}
