// Errors the server reports, by their `code`. {field} is an API field name; leave it as it is.
export default {
  // Poll fields
  'errors.not_text': '{field} precisa ser texto.',
  'errors.title_required': 'Adicione um título.',
  'errors.name_required': 'Adicione um nome.',
  'errors.title_too_long': { one: 'O título deve ter menos de {count} caractere.', many: 'O título deve ter menos de {count} caracteres.', other: 'O título deve ter menos de {count} caracteres.' },
  'errors.description_too_long': { one: 'A descrição deve ter menos de {count} caractere.', many: 'A descrição deve ter menos de {count} caracteres.', other: 'A descrição deve ter menos de {count} caracteres.' },
  'errors.location_too_long': { one: 'O local deve ter menos de {count} caractere.', many: 'O local deve ter menos de {count} caracteres.', other: 'O local deve ter menos de {count} caracteres.' },
  'errors.note_too_long': { one: 'A observação deve ter menos de {count} caractere.', many: 'A observação deve ter menos de {count} caracteres.', other: 'A observação deve ter menos de {count} caracteres.' },
  'errors.name_too_long': { one: 'O nome deve ter menos de {count} caractere.', many: 'O nome deve ter menos de {count} caracteres.', other: 'O nome deve ter menos de {count} caracteres.' },
  'errors.not_whole_number': '{field} precisa ser um número inteiro.',
  'errors.poll_not_object': 'Envie a enquete como um objeto JSON.',
  'errors.closes_on_invalid': 'Escolha uma data de encerramento válida dentro dos próximos três anos.',
  'errors.closes_on_passed': 'Essa data de encerramento já passou. Escolha hoje ou uma data posterior.',
  'errors.timezone_invalid': 'Escolha um fuso horário válido, como Europe/London.',
  'errors.kind_invalid': 'Escolha datas específicas ou dias da semana.',
  'errors.weekly_sent_dates': 'Esta é uma enquete semanal. Envie "weekdays" em vez de "dates".',
  'errors.weekdays_required': 'Escolha pelo menos um dia da semana.',
  'errors.weekdays_invalid': 'Os dias da semana devem ser números de 0 (domingo) a 6 (sábado).',
  'errors.dates_sent_weekdays': 'Esta enquete usa datas específicas. Envie "dates" em vez de "weekdays".',
  'errors.dates_required': 'Escolha pelo menos uma data.',
  'errors.too_many_dates': { one: 'Escolha no máximo {count} data.', many: 'Escolha no máximo {count} datas.', other: 'Escolha no máximo {count} datas.' },
  'errors.date_invalid': '“{date}” não é uma data válida.',
  'errors.dates_out_of_range': 'Escolha datas dentro dos próximos três anos.',
  'errors.dates_all_passed': 'Todas essas datas já passaram. Escolha pelo menos uma data futura.',
  'errors.slot_minutes_invalid': 'Os intervalos de horário devem ser de 15, 30 ou 60 minutos.',
  'errors.end_before_start': 'O horário de término deve ser depois do horário de início.',
  'errors.duration_invalid': 'A duração da reunião deve ficar entre 15 minutos e 12 horas.',
  'errors.allow_edits_invalid': 'Informe se os convidados podem alterar as respostas (true ou false).',
  'errors.visibility_invalid': 'Escolha quem pode ver as respostas.',
  'errors.times_misaligned': { one: 'Os horários de início e término devem seguir intervalos de {count} minuto.', many: 'Os horários de início e término devem seguir intervalos de {count} minutos.', other: 'Os horários de início e término devem seguir intervalos de {count} minutos.' },
  'errors.range_too_short': 'A faixa de horário é menor que um intervalo.',
  'errors.duration_too_long': 'A reunião é mais longa que a faixa de horário. Amplie os horários ou encurte a reunião.',
  'errors.too_many_slots': 'São horários demais para escolher. Escolha menos datas ou uma faixa menor.',
  'errors.no_slots': 'Nenhum desses horários existe nesse fuso horário.',

  // Responses
  'errors.response_not_object': 'Envie a resposta como um objeto JSON.',
  'errors.name_invisible': 'Adicione um nome que as pessoas possam ver.',
  'errors.not_time_list': '{field} precisa ser uma lista de horários.',

  // Final time
  'errors.final_required': 'Escolha um horário de início e de término.',
  'errors.final_end_before_start': 'O horário definitivo precisa terminar depois de começar.',
  'errors.final_too_long': 'O horário definitivo pode durar no máximo 24 horas.',
  'errors.final_bad_length': 'A duração do horário definitivo deve ser um múltiplo de 5 minutos.',
  'errors.final_not_a_time': 'O horário definitivo precisa começar em um dos horários da enquete.',

  // Requests
  'errors.too_many_requests': 'Solicitações demais desta conexão. Aguarde alguns minutos e tente de novo.',
  'errors.json_required': 'Envie JSON com Content-Type: application/json.',
  'errors.body_too_large': 'Essa solicitação é grande demais.',
  'errors.invalid_json': 'O corpo da solicitação não é um JSON válido.',
  'errors.method_not_allowed': 'Esse método não é permitido aqui.',
  'errors.not_found': 'Não encontrado.',
  'errors.server_error': 'Algo deu errado do nosso lado. Tente de novo.',

  // Polls and access
  'errors.poll_not_found': 'Esta enquete não existe. Talvez tenha sido excluída ou tenha expirado.',
  'errors.admin_link_or_password_wrong': 'Esse link privado ou senha não está correto. O link pode ter sido substituído, ou a senha pode ter mudado.',
  'errors.admin_link_invalid': 'Este link privado não é válido. Talvez tenha sido substituído.',
  'errors.changes_not_object': 'Envie as alterações como um objeto JSON.',
  'errors.reopen_with_final': 'Reabrir uma enquete apaga o horário definitivo, então envie um ou outro.',
  'errors.status_invalid': 'O status deve ser "open" ou "closed".',
  'errors.no_final_time': 'Esta enquete ainda não tem um horário definitivo.',

  // Answering
  'errors.poll_closed': 'Esta enquete está encerrada, então não está recebendo novas respostas.',
  'errors.poll_closed_no_changes': 'Esta enquete está encerrada, então as respostas não podem mais ser alteradas.',
  'errors.edits_not_allowed': 'O organizador não permite alterar as respostas depois de enviadas. Você ainda pode excluir a sua.',
  'errors.too_many_responses': { one: 'Esta enquete já tem {count} resposta.', many: 'Esta enquete já tem {count} respostas.', other: 'Esta enquete já tem {count} respostas.' },
  'errors.name_taken': 'Alguém já respondeu como “{name}”. Se foi você, abra seu link privado de edição. Se não, adicione a inicial do sobrenome.',
  'errors.name_taken_other': 'Outra pessoa já respondeu como “{name}”. Tente adicionar a inicial do sobrenome.',
  'errors.response_not_found': 'Essa resposta não existe mais.',
  'errors.my_response_not_found': 'Não encontramos sua resposta. Talvez ela tenha sido excluída.',
  'errors.not_your_response': 'Só quem enviou esta resposta pode alterá-la.',

  // Passwords
  'errors.password_unreadable': 'Não foi possível ler essa senha. Recarregue a página e tente de novo.',
  'errors.too_many_wrong_passwords': 'Senhas erradas demais para esta enquete. Aguarde uma hora e tente de novo, ou use seu link privado.',
  'errors.password_no_longer_works': 'Essa senha não funciona mais para esta resposta. Talvez tenha sido alterada.',
  'errors.sign_in_incomplete': 'Digite o nome com que você respondeu e sua senha.',
  'errors.sign_in_failed': 'Esse nome e essa senha não correspondem a nenhuma resposta com senha. Confira a grafia ou use seu link privado de edição.',

  // Email
  'errors.email_not_set_up': 'O e-mail não está configurado nesta cópia do Overlap.',
  'errors.email_invalid': 'Isso não parece um endereço de e-mail.',
  'errors.link_not_current': 'Esse link privado não é o atual. Recarregue a página e tente de novo.',
  'errors.email_nothing_chosen': 'Escolha o que receber por e-mail: seu link, atualizações ou ambos.',
  'errors.email_daily_limit': 'O Overlap já enviou e-mails suficientes para esse endereço (ou para esta enquete) hoje. Tente de novo amanhã.',
  'errors.email_send_failed': 'Não foi possível enviar o e-mail agora. Tente de novo daqui a um minuto.',
  'errors.confirm_link_expired': 'Este link de confirmação expirou ou já foi substituído. Peça os e-mails de novo na página da enquete.',
};
