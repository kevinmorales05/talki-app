import { ApiProperty } from '@nestjs/swagger';

export class CreateKidDto {
  @ApiProperty({ description: 'The first name of the kid', required: false })
  readonly name?: string;

  @ApiProperty({ description: 'The last name of the kid', required: false })
  readonly lastname?: string;

  @ApiProperty({ description: 'The birthday of the kid', required: false })
  readonly birthday?: Date;

  @ApiProperty({ description: 'The ID of the user (parent/guardian)' })
  readonly user_id: string;

  @ApiProperty({ description: 'The special need of the kid', enum: ['down_syndrome', 'autism', 'speech', 'none'], required: false })
  readonly specialNeed?: 'down_syndrome' | 'autism' | 'speech' | 'none';
}
