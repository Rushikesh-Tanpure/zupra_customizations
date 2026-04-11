FROM frappe/erpnext:v16.13.2

USER frappe

WORKDIR /home/frappe/frappe-bench

# Copy zupra_customizations app
COPY --chown=frappe:frappe ./zupra_customizations /home/frappe/frappe-bench/apps/zupra_customizations

# Install app, build all assets including zupra_customizations
RUN ./env/bin/pip install -e apps/zupra_customizations --quiet && \
  bench build --app zupra_customizations && \
  bench build --force && \
  rm -rf /home/frappe/frappe-bench/sites/assets/zupra_customizations && \
  mkdir -p /home/frappe/frappe-bench/sites/assets/zupra_customizations/js && \
  mkdir -p /home/frappe/frappe-bench/sites/assets/zupra_customizations/css && \
  cp /home/frappe/frappe-bench/apps/zupra_customizations/zupra_customizations/public/js/* \
  /home/frappe/frappe-bench/sites/assets/zupra_customizations/js/ && \
  cp /home/frappe/frappe-bench/apps/zupra_customizations/zupra_customizations/public/css/* \
  /home/frappe/frappe-bench/sites/assets/zupra_customizations/css/

# Stay as frappe user - DO NOT switch to root