import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Numéro expéditeur (avec indicatif pays)',
    example: '33123456789',
  })
  from: string;

  @ApiProperty({
    description: 'Numéro destinataire (avec indicatif pays)',
    example: '33987654321',
  })
  to: string;

  @ApiProperty({
    description: 'Message à envoyer',
    example: 'Votre code de validation est: 123456',
  })
  message: string;
}