import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AEJobService,
  CreateJobInput,
} from '../../../application/argentina-empleos/ae-job.service';

@Controller('argentina-empleos/jobs')
export class AEJobsController {
  constructor(private readonly jobService: AEJobService) {}

  @Get('feed')
  async getFeed(
    @Query('provinceId') provinceId?: string,
    @Query('cityId') cityId?: string,
    @Query('modality') modality?: string,
    @Query('categoryId') categoryId?: string,
    @Query('query') query?: string,
    @Query('userProvinceId') userProvinceId?: string,
    @Query('userCityId') userCityId?: string,
  ) {
    return await this.jobService.getFeedCategorized({
      provinceId,
      cityId,
      modality,
      categoryId,
      query,
      userProvinceId,
      userCityId,
    });
  }

  @Get('mine')
  async getMyJobs(@Headers('x-ae-user-id') userId: string) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.jobService.listUserJobs(userId);
  }

  @Get(':id')
  async getJob(
    @Param('id') id: string,
    @Headers('x-ae-user-id') userId?: string,
  ) {
    return await this.jobService.getJobById(id, userId);
  }

  @Post()
  async createJob(
    @Headers('x-ae-user-id') userId: string,
    @Body() input: CreateJobInput,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.jobService.createJob(userId, input);
  }

  @Patch(':id')
  async updateJob(
    @Param('id') id: string,
    @Headers('x-ae-user-id') userId: string,
    @Body() partial: any,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.jobService.updateJob(id, userId, partial);
  }

  @Post(':id/apply')
  async applyToJob(
    @Param('id') id: string,
    @Headers('x-ae-user-id') userId: string,
    @Body('message') message: string,
    @Body('phone') phone?: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario para postularse');
    return await this.jobService.applyToJob(id, userId, message || '', phone);
  }

  @Get(':id/applications')
  async getJobApplications(
    @Param('id') id: string,
    @Headers('x-ae-user-id') userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.jobService.getJobApplications(id, userId);
  }

  @Post(':id/accept-terms')
  async acceptTerms(
    @Param('id') id: string,
    @Headers('x-ae-user-id') userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    return await this.jobService.acceptJobTerms(id, userId);
  }

  @Post('invite-candidate')
  async inviteCandidate(
    @Headers('x-ae-user-id') userId: string,
    @Body('jobId') jobId: string,
    @Body('candidateId') candidateId: string,
    @Body('customMessage') customMessage?: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario administrador');
    return await this.jobService.inviteCandidateToJob(userId, jobId, candidateId, customMessage);
  }

  @Delete(':id')
  async deleteJob(
    @Param('id') id: string,
    @Headers('x-ae-user-id') userId: string,
  ) {
    if (!userId) throw new UnauthorizedException('Falta ID de usuario');
    await this.jobService.deleteJob(id, userId);
    return { success: true };
  }
}
