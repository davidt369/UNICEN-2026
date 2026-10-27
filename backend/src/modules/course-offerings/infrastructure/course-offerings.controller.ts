import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CourseOfferingsService } from '../application/course-offerings.service';
import {
  CreateAcademicPeriodDto,
  CreateCourseOfferingDto,
  TogglePeriodEnrollmentsDto,
  UpdateCourseEvaluationsDto,
} from '../application/dtos/course-offerings.dto';
import { PasetoAuthGuard } from '../../identity-and-access/infrastructure/guards/paseto-auth.guard';
import { RolesGuard } from '../../identity-and-access/infrastructure/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';

@Controller('course-offerings')
@UseGuards(PasetoAuthGuard, RolesGuard)
export class CourseOfferingsController {
  constructor(
    private readonly offeringsService: CourseOfferingsService,
  ) {}

  @Get('periods')
  async getPeriods() {
    return this.offeringsService.getPeriods();
  }

  @Post('periods')
  @Roles('ADMINISTRADOR')
  async createPeriod(@Body() dto: CreateAcademicPeriodDto) {
    return this.offeringsService.createPeriod(dto);
  }

  @Patch('periods/:id/enrollments-status')
  @Roles('ADMINISTRADOR')
  async togglePeriodEnrollments(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TogglePeriodEnrollmentsDto,
  ) {
    return this.offeringsService.togglePeriodEnrollments(
      id,
      dto.enrollmentsOpen,
    );
  }

  @Get()
  async getOfferings(
    @Query('periodId') periodId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('careerId') careerId?: string,
  ) {
    return this.offeringsService.getOfferings({
      periodId: periodId ? parseInt(periodId, 10) : undefined,
      teacherId: teacherId ? parseInt(teacherId, 10) : undefined,
      careerId: careerId ? parseInt(careerId, 10) : undefined,
    });
  }

  @Get(':id')
  async getOfferingById(@Param('id', ParseIntPipe) id: number) {
    return this.offeringsService.getOfferingById(id);
  }

  @Post()
  @Roles('ADMINISTRADOR')
  async createOffering(@Body() dto: CreateCourseOfferingDto) {
    return this.offeringsService.createOffering(dto);
  }

  @Put(':id/evaluations')
  @Roles('ADMINISTRADOR', 'DOCENTE')
  async updateEvaluations(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCourseEvaluationsDto,
  ) {
    return this.offeringsService.updateCourseEvaluations(id, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  async softDeleteOffering(@Param('id', ParseIntPipe) id: number) {
    return this.offeringsService.softDeleteOffering(id);
  }
}
