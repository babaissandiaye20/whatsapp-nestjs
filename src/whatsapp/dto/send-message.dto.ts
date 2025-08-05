import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Numéro destinataire (avec indicatif pays)',
    example: '221123456789',
  })
  to: string;

  @ApiProperty({
    description: 'Message à envoyer',
    example: 'Votre code de validation est: 123456',
  })
  message: string;
}