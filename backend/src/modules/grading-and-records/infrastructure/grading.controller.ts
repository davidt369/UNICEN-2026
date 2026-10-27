import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GradingService } from '../application/grading.service';
import { RecordGradeDto } from '../application/dtos/grading.dto';
import { PasetoAuthGuard } from '../../identity-and-access/infrastructure/guards/paseto-auth.guard';
import { RolesGuard } from '../../identity-and-access/infrastructure/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/decorators/current-user.decorator';

@Controller('grading')
@UseGuards(PasetoAuthGuard, RolesGuard)
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @Post('record')
  @Roles('DOCENTE', 'ADMINISTRADOR')
  async recordGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordGradeDto,
  ) {
    return this.gradingService.recordGrade(user, dto);
  }

  @Get('course/:courseOfferingId/gradebook')
  @Roles('DOCENTE', 'ADMINISTRADOR')
  async getCourseGradebook(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseOfferingId', ParseIntPipe) courseOfferingId: number,
  ) {
    return this.gradingService.getCourseGradebook(courseOfferingId, user);
  }

  @Get('my-kardex')
  @Roles('ESTUDIANTE')
  async getMyKardex(@CurrentUser() user: AuthenticatedUser) {
    return this.gradingService.getStudentKardex(user.id);
  }

  @Get('student/:studentId/kardex')
  @Roles('ADMINISTRADOR')
  async getStudentKardex(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.gradingService.getStudentKardex(studentId);
  }
}
