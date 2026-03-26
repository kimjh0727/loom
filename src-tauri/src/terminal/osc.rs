// Phase 5-B에서 구현: OSC 9/99/777 이스케이프 시퀀스 파서

/// OSC 시퀀스를 감지하고 제거한 후 알림으로 변환
/// 반환: (정제된 바이트, 감지된 알림 목록)
pub fn parse_and_strip(_input: &[u8]) -> (Vec<u8>, Vec<OscNotification>) {
    // 스텁: 입력을 그대로 반환
    (_input.to_vec(), vec![])
}

pub struct OscNotification {
    pub title: String,
    pub body: String,
    pub source: String,
}
