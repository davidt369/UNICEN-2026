import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentsService } from '../application/enrollments.service';
import { CreateEnrollmentDto } from '../application/dtos/enrollment.dto';
import { PasetoAuthGuard } from '../../identity-and-access/infrastructure/guards/paseto-auth.guard';
import { RolesGuard } from '../../identity-and-access/infrastructure/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/decorators/current-user.decorator';

@Controller('enrollments')
@UseGuards(PasetoAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles('ESTUDIANTE', 'ADMINISTRADOR')
  async enroll(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEnrollmentDto,
  ) {
    return this.enrollmentsService.enroll(user, dto);
  }

  @Delete(':id')
  @Roles('ESTUDIANTE', 'ADMINISTRADOR')
  async withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.enrollmentsService.withdraw(user, id);
  }

  @Get('my')
  @Roles('ESTUDIANTE')
  async getMyEnrollments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.enrollmentsService.getMyEnrollments(
      user.id,
      periodId ? parseInt(periodId, 10) : undefined,
    );
  }

  @Get('student/:studentId')
  @Roles('ADMINISTRADOR', 'DOCENTE')
  async getStudentEnrollments(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('periodId') periodId?: string,
  ) {
    return this.enrollmentsService.getMyEnrollments(
      studentId,
      periodId ? parseInt(periodId, 10) : undefined,
    );
  }

  @Get('course/:courseOfferingId')
  @Roles('ADMINISTRADOR', 'DOCENTE')
  async getCourseEnrollments(
    @Param('courseOfferingId', ParseIntPipe) courseOfferingId: number,
  ) {
    return this.enrollmentsService.getEnrollmentsByCourse(courseOfferingId);
  }
}
