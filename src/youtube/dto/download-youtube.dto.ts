import { IsString, IsUrl, Matches } from 'class-validator';

export class DownloadYoutubeDto {
  @IsString()
  @IsUrl({}, { message: 'Debe ser una URL válida' })
  @Matches(
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/,
    { message: 'Debe ser una URL válida de YouTube' },
  )
  url: string;
}
