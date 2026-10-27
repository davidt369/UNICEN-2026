import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from '../application/catalog.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
} from '../application/dtos/catalog.dto';
import { PasetoAuthGuard } from '../../identity-and-access/infrastructure/guards/paseto-auth.guard';
import { RolesGuard } from '../../identity-and-access/infrastructure/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';

@Controller('catalog')
@UseGuards(PasetoAuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('campuses')
  async getCampuses() {
    return this.catalogService.getCampuses();
  }

  @Get('careers')
  async getCareers() {
    return this.catalogService.getCareers();
  }

  @Get('subjects')
  async getSubjects(@Query('careerId') careerId?: string) {
    const parsedCareerId = careerId ? parseInt(careerId, 10) : undefined;
    return this.catalogService.getSubjects(parsedCareerId);
  }

  @Post('subjects')
  @Roles('ADMINISTRADOR')
  async createSubject(@Body() dto: CreateSubjectDto) {
    return this.catalogService.createSubject(dto);
  }

  @Patch('subjects/:id')
  @Roles('ADMINISTRADOR')
  async updateSubject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.catalogService.updateSubject(id, dto);
  }

  @Delete('subjects/:id')
  @Roles('ADMINISTRADOR')
  async softDeleteSubject(@Param('id', ParseIntPipe) id: number) {
    return this.catalogService.softDeleteSubject(id);
  }
}
