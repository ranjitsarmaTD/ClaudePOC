import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Repository owner is required (e.g., "facebook")' })
  owner!: string;

  @IsString()
  @IsNotEmpty({ message: 'Repository name is required (e.g., "react")' })
  repo!: string;

  @IsString()
  @IsNotEmpty({ message: 'Question is required' })
  question!: string;

  @IsString()
  @IsOptional()
  repoType?: string;
}
