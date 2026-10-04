-- Docker ejecuta este archivo solo la primera vez que crea el volumen de la base de datos.
-- Crea una base aparte para las pruebas automatizadas, así no se borran tus datos de desarrollo.
CREATE DATABASE grupo_estudio_test;
