
DELIMITER //
CREATE TRIGGER `after_company_delete` AFTER DELETE ON `company_master`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Company', 'DELETE', NULL, CONCAT('Deleted record: ', OLD.id), NULL, 'Success');
END//

CREATE TRIGGER `after_company_insert` AFTER INSERT ON `company_master`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Company', 'INSERT', NULL, NULL, CONCAT('New record: ', NEW.id), 'Success');
END//

CREATE TRIGGER `after_company_update` AFTER UPDATE ON `company_master`
 FOR EACH ROW BEGIN
    IF OLD.company_name <> NEW.company_name THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Company', 'UPDATE', 'company_name', OLD.company_name, NEW.company_name, 'Success');
    END IF;
    
    IF OLD.company_gst <> NEW.company_gst THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Company', 'UPDATE', 'company_gst', OLD.company_gst, NEW.company_gst, 'Success');
    END IF;
END//

CREATE TRIGGER `after_expenses_delete` AFTER DELETE ON `expenses_master`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Expense', 'DELETE', NULL, CONCAT('Deleted record: ', OLD.id), NULL, 'Success');
END//

CREATE TRIGGER `after_expenses_insert` AFTER INSERT ON `expenses_master`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Expense', 'INSERT', NULL, NULL, CONCAT('New record: ', NEW.id), 'Success');
END//

CREATE TRIGGER `after_expenses_update` AFTER UPDATE ON `expenses_master`
 FOR EACH ROW BEGIN
    IF OLD.date <> NEW.date THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Expense', 'UPDATE', 'date', OLD.date, NEW.date, 'Success');
    END IF;
    
    IF OLD.description <> NEW.description THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Expense', 'UPDATE', 'description', OLD.description, NEW.description, 'Success');
    END IF;
    
    IF OLD.amount <> NEW.amount THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Expense', 'UPDATE', 'amount', OLD.amount, NEW.amount, 'Success');
    END IF;
END//

CREATE TRIGGER `after_fooditem_delete` AFTER DELETE ON `fooditemmaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Food', 'DELETE', NULL, CONCAT('Deleted record: ', OLD.id), NULL, 'Success');
END//

CREATE TRIGGER `after_fooditem_update` AFTER UPDATE ON `fooditemmaster`
 FOR EACH ROW BEGIN
    IF OLD.item_name <> NEW.item_name THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Food', 'UPDATE', 'item_name', OLD.item_name, NEW.item_name, 'Success');
    END IF;
    
    IF OLD.price <> NEW.price THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Food', 'UPDATE', 'price', OLD.price, NEW.price, 'Success');
    END IF;
END//

CREATE TRIGGER `after_fooditen_insert` AFTER INSERT ON `fooditemmaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Food', 'INSERT', NULL, NULL, CONCAT('New record: ', NEW.id), 'Success');
END//

CREATE TRIGGER `after_guest_delete` AFTER DELETE ON `guestmaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Guest', 'DELETE', NULL, CONCAT('Deleted record: ', OLD.id), NULL, 'Success');
END//

CREATE TRIGGER `after_guest_insert` AFTER INSERT ON `guestmaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Guest', 'INSERT', NULL, NULL, CONCAT('New record: ', NEW.id), 'Success');
END//

CREATE TRIGGER `after_guest_update` AFTER UPDATE ON `guestmaster`
 FOR EACH ROW BEGIN
    IF OLD.email <> NEW.email THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'email', OLD.email, NEW.email, 'Success');
    END IF;

    IF OLD.phone_number <> NEW.phone_number THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'phone_number', OLD.phone_number, NEW.phone_number, 'Success');
    END IF;

    IF OLD.address <> NEW.address THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'address', OLD.address, NEW.address, 'Success');
    END IF;

    IF OLD.password <> NEW.password THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'password', OLD.password, NEW.password, 'Success');
    END IF;

    IF OLD.document <> NEW.document THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'document', OLD.document, NEW.document, 'Success');
    END IF;

    IF OLD.document_images <> NEW.document_images THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'document_images', OLD.document_images, NEW.document_images, 'Success');
    END IF;

    IF OLD.fullname <> NEW.fullname THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'fullname', OLD.fullname, NEW.fullname, 'Success');
    END IF;

    IF OLD.gst_number <> NEW.gst_number THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'gst_number', OLD.gst_number, NEW.gst_number, 'Success');
    END IF;

    IF OLD.default_checkin <> NEW.default_checkin THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'default_checkin', OLD.default_checkin, NEW.default_checkin, 'Success');
    END IF;

    IF OLD.default_checkout <> NEW.default_checkout THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'default_checkout', OLD.default_checkout, NEW.default_checkout, 'Success');
    END IF;

    IF OLD.gender <> NEW.gender THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'gender', OLD.gender, NEW.gender, 'Success');
    END IF;

    IF OLD.nationality <> NEW.nationality THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Guest', 'UPDATE', 'nationality', OLD.nationality, NEW.nationality, 'Success');
    END IF;

    IF OLD.privacy <> NEW.privacy THEN
    IF OLD.privacy = 0 AND NEW.privacy = 1 THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Dashboard', 'UPDATE', 'privacy', 'OFF', 'ON', 'Success');
    ELSEIF OLD.privacy = 1 AND NEW.privacy = 0 THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Dashboard', 'UPDATE', 'privacy', 'ON', 'OFF', 'Success');
    END IF;
    END IF;

    IF OLD.image <> NEW.image THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Profile', 'UPDATE', 'image', OLD.image, NEW.image, 'Success');
    END IF;
END//

CREATE TRIGGER `after_reservation_delete` AFTER DELETE ON `reservationmaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Booking', 'DELETE', NULL, CONCAT('Deleted record: ', OLD.id), NULL, 'Success');
END//

CREATE TRIGGER `after_reservation_insert` AFTER INSERT ON `reservationmaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Booking', 'INSERT', NULL, NULL, CONCAT('New record: ', NEW.id), 'Success');
END//

CREATE TRIGGER `after_reservation_update` AFTER UPDATE ON `reservationmaster`
 FOR EACH ROW BEGIN
    IF OLD.room_id <> NEW.room_id THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'room_id', OLD.room_id, NEW.room_id, 'Success');
    END IF;

    IF OLD.check_in <> NEW.check_in THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'check_in', OLD.check_in, NEW.check_in, 'Success');
    END IF;

    IF OLD.check_out <> NEW.check_out THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'check_out', OLD.check_out, NEW.check_out, 'Success');
    END IF;

    IF OLD.booking_date <> NEW.booking_date THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'booking_date', OLD.booking_date, NEW.booking_date, 'Success');
    END IF;

    IF OLD.total_days <> NEW.total_days THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'total_days', OLD.total_days, NEW.total_days, 'Success');
    END IF;

    IF OLD.taxable_price <> NEW.taxable_price THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'taxable_price', OLD.taxable_price, NEW.taxable_price, 'Success');
    END IF;

    IF OLD.cgst <> NEW.cgst THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'cgst', OLD.cgst, NEW.cgst, 'Success');
    END IF;

    IF OLD.sgst <> NEW.sgst THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'sgst', OLD.sgst, NEW.sgst, 'Success');
    END IF;

    IF OLD.igst <> NEW.igst THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'igst', OLD.igst, NEW.igst, 'Success');
    END IF;

    IF OLD.total_price <> NEW.total_price THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'total_price', OLD.total_price, NEW.total_price, 'Success');
    END IF;

    IF OLD.adv_payment <> NEW.adv_payment THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'adv_payment', OLD.adv_payment, NEW.adv_payment, 'Success');
    END IF;

    IF OLD.payment_status <> NEW.payment_status THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'payment_status', OLD.payment_status, NEW.payment_status, 'Success');
    END IF;

    IF OLD.payment_type <> NEW.payment_type THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'payment_type', OLD.payment_type, NEW.payment_type, 'Success');
    END IF;

    IF OLD.status <> NEW.status THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'status', OLD.status, NEW.status, 'Success');
    END IF;

    IF OLD.cancel_date <> NEW.cancel_date THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'cancel_date', OLD.cancel_date, NEW.cancel_date, 'Success');
    END IF;

    IF OLD.arrival_time <> NEW.arrival_time THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'arrival_time', OLD.arrival_time, NEW.arrival_time, 'Success');
    END IF;

    IF OLD.discount <> NEW.discount THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'discount', OLD.discount, NEW.discount, 'Success');
    END IF;

    IF OLD.invoice_num <> NEW.invoice_num THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'invoice_num', OLD.invoice_num, NEW.invoice_num, 'Success');
    END IF;

    IF OLD.remaining_amount <> NEW.remaining_amount THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'remaining_amount', OLD.remaining_amount, NEW.remaining_amount, 'Success');
    END IF;

    IF OLD.received_amount <> NEW.received_amount THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'received_amount', OLD.received_amount, NEW.received_amount, 'Success');
    END IF;

    IF OLD.gst_status <> NEW.gst_status THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'gst_status', OLD.gst_status, NEW.gst_status, 'Success');
    END IF;

    IF OLD.extra_person_doc <> NEW.extra_person_doc THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'extra_person_doc', OLD.extra_person_doc, NEW.extra_person_doc, 'Success');
    END IF;

    IF OLD.user_id <> NEW.user_id THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'user_id', OLD.user_id, NEW.user_id, 'Success');
    END IF;

    IF OLD.after_discount_price <> NEW.after_discount_price THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'after_discount_price', OLD.after_discount_price, NEW.after_discount_price, 'Success');
    END IF;

    IF OLD.departure_time <> NEW.departure_time THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'departure_time', OLD.departure_time, NEW.departure_time, 'Success');
    END IF;

    IF OLD.perdayprice <> NEW.perdayprice THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking', 'UPDATE', 'perdayprice', OLD.perdayprice, NEW.perdayprice, 'Success');
    END IF;
END//

CREATE TRIGGER `after_room_delete` AFTER DELETE ON `roommaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Room', 'DELETE', NULL, CONCAT('Deleted record: ', OLD.id), NULL, 'Success');
END//

CREATE TRIGGER `after_room_insert` AFTER INSERT ON `roommaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Room', 'INSERT', NULL, NULL, CONCAT('New record: ', NEW.id), 'Success');
END//

CREATE TRIGGER `after_room_update` AFTER UPDATE ON `roommaster`
 FOR EACH ROW BEGIN
    IF OLD.title <> NEW.title THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'title', OLD.title, NEW.title, 'Success');
    END IF;

    IF OLD.floor_no <> NEW.floor_no THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'floor_no', OLD.floor_no, NEW.floor_no, 'Success');
    END IF;

    IF OLD.images <> NEW.images THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'images', OLD.images, NEW.images, 'Success');
    END IF;

    IF OLD.bed_type <> NEW.bed_type THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'bed_type', OLD.bed_type, NEW.bed_type, 'Success');
    END IF;

    IF OLD.perdayprice <> NEW.perdayprice THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'perdayprice', OLD.perdayprice, NEW.perdayprice, 'Success');
    END IF;

    IF OLD.description <> NEW.description THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'description', OLD.description, NEW.description, 'Success');
    END IF;

    IF OLD.tax_type <> NEW.tax_type THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'tax_type', OLD.tax_type, NEW.tax_type, 'Success');
    END IF;

    IF OLD.facilities <> NEW.facilities THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'facilities', OLD.facilities, NEW.facilities, 'Success');
    END IF;

    IF OLD.disabled <> NEW.disabled THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'disabled', OLD.disabled, NEW.disabled, 'Success');
    END IF;

    IF OLD.room_size <> NEW.room_size THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room', 'UPDATE', 'room_size', OLD.room_size, NEW.room_size, 'Success');
    END IF;
END//

CREATE TRIGGER `after_roomservice_delete` AFTER DELETE ON `roomservicemaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Room Service', 'DELETE', NULL, CONCAT('Deleted record: ', OLD.id), NULL, 'Success');
END//

CREATE TRIGGER `after_roomservice_insert` AFTER INSERT ON `roomservicemaster`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Room Service', 'INSERT', NULL, NULL, CONCAT('New record: ', NEW.id), 'Success');
END//

CREATE TRIGGER `after_roomservice_update` AFTER UPDATE ON `roomservicemaster`
 FOR EACH ROW BEGIN
    IF OLD.reservation_id <> NEW.reservation_id THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service', 'UPDATE', 'reservation_id', OLD.reservation_id, NEW.reservation_id, 'Success');
    END IF;

    IF OLD.order_date <> NEW.order_date THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service', 'UPDATE', 'order_date', OLD.order_date, NEW.order_date, 'Success');
    END IF;

    IF OLD.sub_total <> NEW.sub_total THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service', 'UPDATE', 'sub_total', OLD.sub_total, NEW.sub_total, 'Success');
    END IF;

    IF OLD.total <> NEW.total THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service', 'UPDATE', 'total', OLD.total, NEW.total, 'Success');
    END IF;

    IF OLD.payment_status <> NEW.payment_status THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service', 'UPDATE', 'payment_status', OLD.payment_status, NEW.payment_status, 'Success');
    END IF;

    IF OLD.invoice_num <> NEW.invoice_num THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service', 'UPDATE', 'invoice_num', OLD.invoice_num, NEW.invoice_num, 'Success');
    END IF;

    IF OLD.concession <> NEW.concession THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service', 'UPDATE', 'concession', OLD.concession, NEW.concession, 'Success');
    END IF;

    IF OLD.phone_number <> NEW.phone_number THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service', 'UPDATE', 'phone_number', OLD.phone_number, NEW.phone_number, 'Success');
    END IF;

    IF OLD.fullname <> NEW.fullname THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service', 'UPDATE', 'fullname', OLD.fullname, NEW.fullname, 'Success');
    END IF;
END//

CREATE TRIGGER `after_roomserviceitem_delete` AFTER DELETE ON `room_service_item_master`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Room Service Item', 'DELETE', NULL, CONCAT('Deleted record: ', OLD.id), NULL, 'Success');
END//

CREATE TRIGGER `after_roomserviceitem_insert` AFTER INSERT ON `room_service_item_master`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Room Service Item', 'INSERT', NULL, NULL, CONCAT('New record: ', NEW.id), 'Success');
END//

CREATE TRIGGER `after_roomserviceitem_update` AFTER UPDATE ON `room_service_item_master`
 FOR EACH ROW BEGIN
    IF OLD.quantity <> NEW.quantity THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service Item', 'UPDATE', 'quantity', OLD.quantity, NEW.quantity, 'Success');
    END IF;

    IF OLD.price <> NEW.price THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service Item', 'UPDATE', 'price', OLD.price, NEW.price, 'Success');
    END IF;

    IF OLD.total <> NEW.total THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service Item', 'UPDATE', 'total', OLD.total, NEW.total, 'Success');
    END IF;

    IF OLD.item_id <> NEW.item_id THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service Item', 'UPDATE', 'item_id', OLD.item_id, NEW.item_id, 'Success');
    END IF;

    IF OLD.service_id <> NEW.service_id THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service Item', 'UPDATE', 'service_id', OLD.service_id, NEW.service_id, 'Success');
    END IF;

    IF OLD.discount <> NEW.discount THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Room Service Item', 'UPDATE', 'discount', OLD.discount, NEW.discount, 'Success');
    END IF;
END//

CREATE TRIGGER `after_userreservation_delete` AFTER DELETE ON `user_reservation_master`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Booking Guest', 'DELETE', NULL, CONCAT('Deleted record: ', OLD.id), NULL, 'Success');
END//

CREATE TRIGGER `after_userreservation_insert` AFTER INSERT ON `user_reservation_master`
 FOR EACH ROW BEGIN
    INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
    VALUES ('Booking Guest', 'INSERT', NULL, NULL, CONCAT('New record: ', NEW.id), 'Success');
END//

CREATE TRIGGER `after_userreservation_update` AFTER UPDATE ON `user_reservation_master`
 FOR EACH ROW BEGIN
    IF OLD.reservation_id <> NEW.reservation_id THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking Guest', 'UPDATE', 'reservation_id', OLD.reservation_id, NEW.reservation_id, 'Success');
    END IF;

    IF OLD.guest_id <> NEW.guest_id THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking Guest', 'UPDATE', 'guest_id', OLD.guest_id, NEW.guest_id, 'Success');
    END IF;

    IF OLD.arrived_from <> NEW.arrived_from THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking Guest', 'UPDATE', 'arrived_from', OLD.arrived_from, NEW.arrived_from, 'Success');
    END IF;

    IF OLD.company_id <> NEW.company_id THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking Guest', 'UPDATE', 'company_id', OLD.company_id, NEW.company_id, 'Success');
    END IF;

    IF OLD.destination <> NEW.destination THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking Guest', 'UPDATE', 'destination', OLD.destination, NEW.destination, 'Success');
    END IF;

    IF OLD.mode_of_transport <> NEW.mode_of_transport THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking Guest', 'UPDATE', 'mode_of_transport', OLD.mode_of_transport, NEW.mode_of_transport, 'Success');
    END IF; 

    IF OLD.purpose_of_visit <> NEW.purpose_of_visit THEN
        INSERT INTO logmaster (module, operation, fields, oldvalue, newvalue, status)
        VALUES ('Booking Guest', 'UPDATE', 'purpose_of_visit', OLD.purpose_of_visit, NEW.purpose_of_visit, 'Success');
    END IF;
END//

DELIMITER ;