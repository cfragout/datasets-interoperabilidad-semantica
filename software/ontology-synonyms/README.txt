Agregar sinonimos a una ontologia existente.

Para correr el programa:

$ npm install

$ node index -i aptitud.json


Opciones:

-template, -t: template de la ontologia. Debe poseer un string {{content}} el cual será reemplazado por el nuevo contenido.

-input, -i: el archivo grel de open refine con los sinonimos que se van a agregar a la ontologia.

-output, -o: el nombre del archivo de salida.
