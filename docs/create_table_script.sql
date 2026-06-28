-- Create the lookup table for link types
drop TABLE vindexrl.link_document; 
drop TABLE vindexrl.link_type; 
CREATE TABLE vindexrl.link_type (
    id varchar(36) NOT NULL,
    name varchar(100) NOT NULL,
    active_verb varchar(100) NOT NULL,
    has_passive_form boolean NOT NULL DEFAULT true,
    passive_verb_masculine varchar(100),
    passive_verb_feminine varchar(100),
    
    CONSTRAINT pk_link_type PRIMARY KEY (id),
    CONSTRAINT chk_passive_verbs CHECK (
        (has_passive_form IS FALSE) OR 
        (has_passive_form IS TRUE AND passive_verb_masculine IS NOT NULL AND passive_verb_feminine IS NOT NULL)
    )
);

-- Create the link document table with relationships
CREATE TABLE vindexrl.link_document (
    id varchar(36) NOT NULL,
    link_side char(1),
    target_document_gender char(1),
    specific_article boolean NOT NULL DEFAULT false,
    target_article_text varchar(255),
    target_article_anchor varchar(100),
    link_text text,
    link_type_id varchar(36),
    external_link boolean DEFAULT false,
    external_url varchar(2000),
    source_document_id varchar(36),
    target_document_id varchar(36),
    CONSTRAINT pk_link_document PRIMARY KEY (id),
    CONSTRAINT fk_link_document_link_type FOREIGN KEY (link_type_id) REFERENCES vindexrl.link_type (id),
    CONSTRAINT chk_link_side CHECK (link_side IN ('A', 'P')),
    CONSTRAINT chk_target_document_gender CHECK (target_document_gender IN ('M', 'F'))
);


INSERT INTO vindexrl.link_type 
    (id, name, active_verb, has_passive_form, passive_verb_masculine, passive_verb_feminine) 
VALUES
    ('c54787dd-1ebe-454c-ad42-98ae6532401b', 'Deroga', 'Deroga', true, 'Derogado por', 'Derogado por'),
    ('cccdb040-97a0-4741-9c83-6221b5a1296c', 'Modifica', 'Modifica', true, 'Modificado por', 'Modificada por'),
    ('88cc8353-2ac5-4666-ba1a-db9c2c015e12', 'Elimina', 'Elimina', true, 'Eliminado por', 'Eliminada por'),
    ('7c860cff-e45e-4c6c-a076-bea5e89b9e7e', 'Desarrolla', 'Desarrolla', true, 'Desarrollado por', 'Desarrollada por'),
    ('6723ddb6-6534-49dc-8ce0-2c82f2606122', 'Reglamenta', 'Reglamenta', true, 'Reglamentado por', 'Reglamentada por'),
    ('6ef54ddb-7387-4501-a5b4-894557761134', 'Regula', 'Regula', true, 'Regulado por', 'Regulada por'),
    ('063be884-df45-45d2-84ed-3b0cf5153e04', 'Adiciona', 'Adiciona', true, 'Adicionado por', 'Adicionada por');

