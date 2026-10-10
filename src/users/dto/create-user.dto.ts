import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'The first name of the user' })
  readonly name: string;

  @ApiProperty({ description: 'The last name of the user' })
  readonly lastname: string;

  @ApiProperty({ description: 'The email address of the user' })
  readonly email: string;

  @ApiProperty({ description: 'The unique Firebase ID' })
  readonly firebase_id: string;

  @ApiProperty({ description: 'Optional special need details', required: false })
  readonly special_need?: string;
}
