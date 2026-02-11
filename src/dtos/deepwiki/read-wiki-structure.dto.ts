import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ReadWikiStructureDto {
  @IsString()
  @IsNotEmpty({ message: 'Repository owner is required (e.g., "facebook")' })
  owner!: string;

  @IsString()
  @IsNotEmpty({ message: 'Repository name is required (e.g., "react")' })
  repo!: string;

  @IsString()
  @IsOptional()
  repoType?: string;
}
